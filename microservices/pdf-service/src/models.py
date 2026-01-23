from fastapi import UploadFile
from pydantic import BaseModel
from typing import List, Dict


class CareerCurriculumMetadata(BaseModel):
    faculty: str
    school: str
    specialization: str
    studyPlan: str
    academicPeriod: str
    datePrinted: str


class Schedule(BaseModel):
    """
    Represents a schedule containing various details such as assignment,
    associated identifiers, timing, and teacher information.

    The Schedule class is designed to store information regarding a specific
    schedule. It includes attributes for identifying the assignment, the
    timing details for the schedule, and metadata such as the teacher and
    section details. This can be utilized to manage or query scheduled
    events in educational or organizational settings.

    :ivar assignment: The name or title of the specific assignment within
        the schedule.
    :type assignment: str
    :ivar assignmentId: Unique identifier for the assignment associated with
        this schedule.
    :type assignmentId: str
    :ivar day: The day of the week or specific date for the schedule.
    :type day: str
    :ivar start: The start time for the scheduled activity.
    :type start: str
    :ivar end: The end time for the scheduled activity.
    :type end: str
    :ivar type: The type or category of the schedule (e.g., lecture, lab).
    :type type: str
    :ivar scheduleNumber: The schedule's sequence number, providing
        unique order or classification.
    :type scheduleNumber: int
    :ivar sectionNumber: The specific section number associated with this
        schedule.
    :type sectionNumber: int
    :ivar teacher: The name of the teacher responsible for this schedule.
    :type teacher: str
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
    """
    Represents a course section in a school or system.

    This class is used to store and manage information regarding a specific section
    of a course, including details about assignments, schedules, instructors, and
    other essential attributes.

    :ivar assignment: Name of the assigned task or content.
    :type assignment: str
    :ivar assignmentId: Unique identifier for the assignment.
    :type assignmentId: str
    :ivar sectionNumber: The numeric designation of the course section.
    :type sectionNumber: int
    :ivar teacher: Name of the teacher or instructor for the section.
    :type teacher: str
    :ivar schedules: List of schedules associated with the section.
    :type schedules: List[Schedule]
    :ivar credits: Number of academic credits assigned to the section.
    :type credits: int
    :ivar studyPlan: Academic year or session associated with the section.
    :type studyPlan: str
    :ivar maxStudents: Maximum number of students that can enroll in the section.
    :type maxStudents: int
    :ivar courseVisible: Determines if the course section is visible to others.
    :type courseVisible: bool
    """
    assignment: str
    assignmentId: str
    sectionNumber: int
    teacher: str
    schedules: List[Schedule]
    credits: int
    studyPlan: str = ''
    maxStudents: int
    courseVisible: bool = True


class Cycle(BaseModel):
    cycle: str
    courseSections: List[CourseSection]


class CareerCurriculum(BaseModel):
    metadata: CareerCurriculumMetadata
    cycles: List[Cycle]


class Year(BaseModel):
    year: str
    careerCurriculums: List[CareerCurriculum]


class UniversityCurriculum(BaseModel):
    years: List[Year]


# here goes the catalog
class CareerCatalogData(BaseModel):
    studyPlans: List[str]
    cycles: List[str]
    faculty: str
    career: str


class Catalog(BaseModel):
    careers: Dict[str, CareerCatalogData]


# model to receive a curriculum in pdf file
# class CreateCurriculumRequest(BaseModel):
#     pdf: UploadFile


class CreateCurriculumResponse(BaseModel):
    success: bool
    catalog: Catalog
    universityCurriculum: UniversityCurriculum