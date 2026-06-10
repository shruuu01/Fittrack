from api.models import Notification

def create_notification(user, notification_type, message):
    """
    Creates a notification for the specified user.
    Types: WORKOUT, WATER, DIET, GOAL
    """
    try:
        notification = Notification.objects.create(
            user=user,
            type=notification_type,
            message=message,
            is_read=False
        )
        return notification
    except Exception as e:
        print(f"Error creating notification: {e}")
        return None
