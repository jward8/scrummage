from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model — extend here as the project grows."""


class Drill(models.Model):
    SKILL_LEVEL_CHOICES = [
        ("beginner", "Beginner"),
        ("intermediate", "Intermediate"),
        ("advanced", "Advanced"),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    skill_level = models.CharField(max_length=20, choices=SKILL_LEVEL_CHOICES)
    instructions = models.JSONField(default=list)
    video_url = models.URLField(blank=True, null=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="drills"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class PracticePlan(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    coach = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="practice_plans"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


class PracticePlanDrill(models.Model):
    plan = models.ForeignKey(
        PracticePlan, on_delete=models.CASCADE, related_name="plan_drills"
    )
    drill = models.ForeignKey(
        Drill, on_delete=models.CASCADE, related_name="plan_drills"
    )
    order = models.PositiveIntegerField(default=0)
    custom_reps = models.PositiveIntegerField(null=True, blank=True)
    custom_duration = models.PositiveIntegerField(null=True, blank=True)
    coach_notes = models.TextField(blank=True)

    class Meta:
        ordering = ["order"]
        unique_together = [("plan", "order")]

    def __str__(self):
        return f"{self.plan} — {self.drill} (#{self.order})"
