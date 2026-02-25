from pydantic import BaseModel, Field
from typing import List, Dict, Any


class CareerCurriculumMetadata(BaseModel):
    """Metadata extracted from a parsed career curriculum document.

    :ivar faculty: Faculty name.
    :vartype faculty: str
    :ivar school: School or career name.
    :vartype school: str
    :ivar specialization: Specialization label.
    :vartype specialization: str
    :ivar studyPlan: Study plan identifier from source data.
    :vartype studyPlan: str
    :ivar academicPeriod: Academic period string.
    :vartype academicPeriod: str
    :ivar datePrinted: Date printed value extracted from the document.
    :vartype datePrinted: str
    """

    faculty: str
    school: str
    specialization: str
    studyPlan: str
    academicPeriod: str
    datePrinted: str


class Schedule(BaseModel):
    """Represents one schedule slot for a course section.

    :ivar assignment: Assignment name.
    :vartype assignment: str
    :ivar assignmentId: External assignment identifier.
    :vartype assignmentId: str
    :ivar day: Day label.
    :vartype day: str
    :ivar start: Start time.
    :vartype start: str
    :ivar end: End time.
    :vartype end: str
    :ivar type: Session type label.
    :vartype type: str
    :ivar scheduleNumber: Sequence number for the slot.
    :vartype scheduleNumber: int
    :ivar sectionNumber: Source section number for traceability.
    :vartype sectionNumber: int
    :ivar teacher: Teacher name for this slot.
    :vartype teacher: str
    """
    assignment: str
    assignmentId: str
    day: str
    start: str
    end: str
    type: str
    scheduleNumber: int
    sectionNumber: int
    teacher: str


class CourseSection(BaseModel):
    """Represents one course section and its schedule slots.

    :ivar assignment: Assignment name.
    :vartype assignment: str
    :ivar assignmentId: External assignment identifier.
    :vartype assignmentId: str
    :ivar sectionNumber: Numeric section identifier.
    :vartype sectionNumber: int
    :ivar teacher: Main teacher name.
    :vartype teacher: str
    :ivar schedules: Schedule entries linked to this section.
    :vartype schedules: List[Schedule]
    :ivar credits: Credit amount.
    :vartype credits: int
    :ivar studyPlan: Study plan identifier.
    :vartype studyPlan: str
    :ivar maxStudents: Enrollment capacity.
    :vartype maxStudents: int
    :ivar courseVisible: Visibility flag from source.
    :vartype courseVisible: bool
    """
    assignment   : str            = ''
    assignmentId : str            = ''
    sectionNumber: int            = 1
    teacher      : str            = ''
    schedules    : List[Schedule] = Field(default_factory=list)
    credits      : int            = 1
    studyPlan    : str            = ''
    maxStudents  : int            = 1
    courseVisible: bool           = True


class Cycle(BaseModel):
    """Represents one academic cycle and its course sections.

    :ivar cycle: Cycle number (1-10 depending on the career).
    :vartype cycle: str
    :ivar courseSections: Course sections to be initiated in this cycle.
    :vartype courseSections: List[CourseSection]
    """
    cycle: str
    courseSections: List[CourseSection]


class CareerCurriculum(BaseModel):
    """Represents one career curriculum for the study plan

    :ivar metadata: More details about the career curriculum, like faculty, study plan, academic period, ....
    :vartype metadata: CareerCurriculumMetadata
    :ivar cycles: List of cycles that have course sections running for the study plan
    :vartype cycle: List[Cycle]
    """
    metadata: CareerCurriculumMetadata
    cycles: List[Cycle]


class Year(BaseModel):
    """
    Represents one study plan containing many career curriculums
    A study plan takes the name of the year it was developed and launched in.
    Each faculty develops them independently, but for simplicity, this will
    own many career curriculums with the year in common.

    :ivar year: the year it got developed
    :vartype year: str
    :ivar careerCurriculums: List of career curriculums
    :vartype careerCurriculums: List[CareerCurriculum]
    """
    year: str
    careerCurriculums: List[CareerCurriculum]


class UniversityCurriculum(BaseModel):
    """Represents the set of all study plans in the university

    :ivar years: The study plans in the university
    :vartype years: List[Year]
    """
    years: List[Year]


# here goes the catalog
class CatalogCareerData(BaseModel):
    """Catalog details for a single career entry.

    :ivar studyPlans: Available study plan identifiers for this career.
    :vartype studyPlans: List[str]
    :ivar cycles: Available cycle labels for this career.
    :vartype cycles: List[str]
    :ivar faculty: Faculty name.
    :vartype faculty: str
    :ivar career: Career display name.
    :vartype career: str
    """

    studyPlans: List[str]
    cycles: List[str]
    faculty: str
    career: str


class Catalog(BaseModel):
    """Catalog of careers keyed by career identifier.

    :ivar careers: Mapping from career key to career catalog data.
    :vartype careers: Dict[str, CatalogCareerData]
    """

    careers: Dict[str, CatalogCareerData]


# Here come models about responses and requests to the endpoints


class CreateCurriculumResponse(BaseModel):
    """Response payload returned when curriculum creation is queued.

    :ivar success: Indicates whether request handling succeeded.
    :vartype success: bool
    :ivar metadata: Curriculum metadata extracted from input.
    :vartype metadata: CareerCurriculumMetadata
    :ivar curriculumCreationJobId: Job id for curriculum creation processing.
    :vartype curriculumCreationJobId: str
    :ivar catalogRefreshJobId: Job id for catalog refresh processing.
    :vartype catalogRefreshJobId: str
    """

    success                : bool
    metadata               : CareerCurriculumMetadata
    curriculumCreationJobId: str
    catalogRefreshJobId    : str

class AwaitJobResponse(BaseModel):
    """Response payload for waiting on a single job result.

    :ivar success: Indicates whether the await operation succeeded.
    :vartype success: bool
    :ivar result: Job result payload.
    :vartype result: Any
    """

    success: bool
    result: Any

class AwaitTreeResponse(BaseModel):
    """Response payload for waiting on a job tree result.

    :ivar success: Indicates whether the await operation succeeded.
    :vartype success: bool
    :ivar jobIds: Ordered job ids resolved in the tree.
    :vartype jobIds: list[str]
    :ivar results: Result payloads aligned with ``jobIds``.
    :vartype results: list[Any]
    """

    success: bool
    jobIds : list[str]  = Field(default_factory=list)
    results: list[Any] = Field(default_factory=list)
