import logging
import os

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Drill, PracticePlan
from .serializers import DrillSerializer, PracticePlanSerializer

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"video/mp4", "image/jpeg", "image/png", "image/gif"}


class DrillViewSet(viewsets.ModelViewSet):
    serializer_class = DrillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Drill.objects.select_related("created_by").all()
        return Drill.objects.select_related("created_by").filter(created_by=user)


class PracticePlanViewSet(viewsets.ModelViewSet):
    serializer_class = PracticePlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Coaches only see their own plans; staff see all
        user = self.request.user
        if user.is_staff:
            return PracticePlan.objects.select_related("coach").prefetch_related(
                "plan_drills__drill__created_by"
            )
        return PracticePlan.objects.select_related("coach").prefetch_related(
            "plan_drills__drill__created_by"
        ).filter(coach=user)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def generate_presigned_url(request):
    """
    POST /api/s3/presigned-upload/
    Body: { "filename": "video.mp4", "content_type": "video/mp4" }
    Returns: { "upload_url": "<presigned PUT URL>", "object_key": "<key>" }
    """
    filename = request.data.get("filename")
    content_type = request.data.get("content_type")

    if not filename or not content_type:
        return Response(
            {"detail": "Both 'filename' and 'content_type' are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if content_type not in ALLOWED_CONTENT_TYPES:
        return Response(
            {"detail": "Unsupported content type."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    safe_filename = os.path.basename(filename)
    object_key = f"uploads/{request.user.id}/{safe_filename}"

    try:
        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_S3_REGION_NAME,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.AWS_STORAGE_BUCKET_NAME,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=300,  # 5 minutes
        )
    except ClientError as exc:
        logger.error("S3 presigned URL generation failed: %s", exc)
        return Response(
            {"detail": "Upload URL generation failed."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"upload_url": upload_url, "object_key": object_key})
