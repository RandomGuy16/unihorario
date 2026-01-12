
type CurriculumData = {
	title: string,
	json: JSON,
}


function Curriculum(data: Readonly<CurriculumData>) {

	return (
	<div className='u-curriculum'>
		<span className='u-curriculum__title'>{data.title}</span>
		<div className='u-curriculum__options'></div>
	</div>
	);
}

export default Curriculum