from rest_framework import serializers
from core.models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message',
            'status', 'created_at',
        ]
        read_only_fields = ['status', 'created_at']
