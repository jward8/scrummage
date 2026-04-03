from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DrillViewSet, PracticePlanViewSet, generate_presigned_url

router = DefaultRouter()
router.register(r"drills", DrillViewSet, basename="drill")
router.register(r"practice-plans", PracticePlanViewSet, basename="practiceplan")

urlpatterns = [
    path("", include(router.urls)),
    path("s3/presigned-upload/", generate_presigned_url, name="s3-presigned-upload"),
]
