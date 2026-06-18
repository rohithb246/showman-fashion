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


class ContactAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            'id', 'name', 'email', 'subject', 'message',
            'status', 'admin_notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['name', 'email', 'subject', 'message', 'created_at', 'updated_at']
