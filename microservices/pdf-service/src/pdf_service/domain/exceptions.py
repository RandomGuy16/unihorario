

class CurriculumNotFoundError(LookupError):
    """Raised when a requested curriculum doesn't exist in persistence."""
    def __init__(self, *, school: str):
        super().__init__(f"Curriculum not found for school={school!r}")
        self.school = school


class UploadValidationError(ValueError):
    """Raised when an uploaded file fails validation before parsing."""


class UnsupportedUploadTypeError(UploadValidationError):
    """Raised when an uploaded file is not a supported PDF upload."""


class FileTooLargeError(UploadValidationError):
    """Raised when an uploaded file exceeds the configured size limit."""


class MalwareDetectedError(UploadValidationError):
    """Raised when ClamAV reports malware in an uploaded file."""


class ScannerUnavailableError(RuntimeError):
    """Raised when malware scanning is enabled but the scanner is unavailable."""
