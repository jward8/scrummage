import logging
import os

import boto3
from botocore.exceptions import ClientError
from django.conf import settings
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import Drill, PracticePlan, PracticePlanDrill
from .serializers import DrillSerializer, PracticePlanSerializer, PracticePlanDrillSerializer, RegisterSerializer, UserSerializer

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


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

    def _get_plan_or_403(self, pk):
        plan = self.get_object()
        user = self.request.user
        if not user.is_staff and plan.coach != user:
            return None, Response({"detail": "Not found."}, status=status.HTTP_403_FORBIDDEN)
        return plan, None

    @action(detail=True, methods=["post"], url_path="drills")
    def add_drill(self, request, pk=None):
        plan = self.get_object()
        user = request.user
        if not user.is_staff and plan.coach != user:
            return Response({"detail": "Not found."}, status=status.HTTP_403_FORBIDDEN)
        serializer = PracticePlanDrillSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(plan=plan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path=r"drills/(?P<drill_id>[^/.]+)")
    def update_drill(self, request, pk=None, drill_id=None):
        plan = self.get_object()
        user = request.user
        if not user.is_staff and plan.coach != user:
            return Response({"detail": "Not found."}, status=status.HTTP_403_FORBIDDEN)
        try:
            entry = PracticePlanDrill.objects.get(plan=plan, id=drill_id)
        except PracticePlanDrill.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = PracticePlanDrillSerializer(entry, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=["delete"], url_path=r"drills/(?P<drill_id>[^/.]+)")
    def remove_drill(self, request, pk=None, drill_id=None):
        plan = self.get_object()
        user = request.user
        if not user.is_staff and plan.coach != user:
            return Response({"detail": "Not found."}, status=status.HTTP_403_FORBIDDEN)
        try:
            entry = PracticePlanDrill.objects.get(plan=plan, id=drill_id)
        except PracticePlanDrill.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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
