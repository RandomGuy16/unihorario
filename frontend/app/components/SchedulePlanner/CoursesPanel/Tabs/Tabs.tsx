import { ReactNode, useState } from 'react'


interface Tab {
	id: string,
	label: string,
	content: ReactNode
}
interface TabsProps {
	tabs: Tab[],
	defaultActiveTab?: string,
}

function Tabs({ tabs, defaultActiveTab }: Readonly<TabsProps>) {
	const [activeTab, setActiveTab] = useState<string>(defaultActiveTab ?? tabs[0].id)
	
	return (
	<div className="flex flex-col justify-start items-stratch w-full h-full">
		<nav className="hidden flex flex-row justify-start items-center h-4">
			{tabs.map(tab => (
				<button
					id='sidebar__minicalendar-menu-button'
					key={tab.id}
					className={"flex flex-col justify-center h-full"}
					onClick={() => {setActiveTab(tab.id)}}>
					{tab.label}
				</button>
			))}
		</nav>
		<div className="flex flex-col justify-start items-stretch w-full h-full">
			{tabs.find(tab => tab.id === activeTab)?.content}
		</div>
	</div>
	)
}

export default Tabs