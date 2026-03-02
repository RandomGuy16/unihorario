

class CurriculumNotFoundError(LookupError):
    """Raised when a requested curriculum doesn't exist in persistence."""
    def __init__(self, *, school: str):
        super().__init__(f"Curriculum not found for school={school!r}")
        self.school = school