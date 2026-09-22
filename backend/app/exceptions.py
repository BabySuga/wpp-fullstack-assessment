class NotFoundError(Exception):
    def __init__(self, message: str):
        self.message = message

class ValidationError(Exception):
    def __init__(self, message: str, field: str | None = None):
        self.message = message
        self.field = field
