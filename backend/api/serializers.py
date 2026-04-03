from rest_framework import serializers
from .models import User, Drill, PracticePlan, PracticePlanDrill


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id"]


class DrillSerializer(serializers.ModelSerializer):
    """Full nested read; flat write (created_by auto-set from request.user)."""

    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Drill
        fields = [
            "id",
            "title",
            "description",
            "category",
            "skill_level",
            "instructions",
            "video_url",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class PracticePlanDrillSerializer(serializers.ModelSerializer):
    """Nested drill detail for reads; accepts drill id for writes."""

    drill = DrillSerializer(read_only=True)
    drill_id = serializers.PrimaryKeyRelatedField(
        queryset=Drill.objects.all(), source="drill", write_only=True
    )

    class Meta:
        model = PracticePlanDrill
        fields = [
            "id",
            "drill",
            "drill_id",
            "order",
            "custom_reps",
            "custom_duration",
            "coach_notes",
        ]
        read_only_fields = ["id"]


class PracticePlanSerializer(serializers.ModelSerializer):
    """Nested read of coach and plan_drills; flat write."""

    coach = UserSerializer(read_only=True)
    plan_drills = PracticePlanDrillSerializer(many=True, read_only=True)

    class Meta:
        model = PracticePlan
        fields = [
            "id",
            "title",
            "description",
            "coach",
            "plan_drills",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "coach", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data["coach"] = self.context["request"].user
        return super().create(validated_data)
