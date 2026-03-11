import { useState, useEffect, ChangeEvent, DragEvent } from 'react';
import { Info, Upload } from 'lucide-react';
import { useCatalog } from "@/app/providers/useCatalog";
import { useCurriculum } from "@/app/providers/useCurriculum";
import { SubmitCurriculumResponse } from "@/app/models/dto";
import { toast } from "sonner";

interface UploadCurriculumModalProps {
	isOpen: boolean;
	onClose: () => void;
}
function UploadCurriculumModal({ isOpen, onClose }: UploadCurriculumModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const catalogProvider = useCatalog()
	const curriculumProvider = useCurriculum()

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}
	}, [isOpen, onClose]);

	const handleSelectedFile = (selectedFile: File | null) => {
		if (!selectedFile) return;

		if (selectedFile.type !== "application/pdf" && !selectedFile.name.toLowerCase().endsWith(".pdf")) {
			toast.error("Solo se permiten archivos PDF.");
			return;
		}

		setFile(selectedFile);
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		handleSelectedFile(e.target.files?.item(0) ?? null);
	};

	const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
		e.preventDefault();
		setIsDragging(false);
		handleSelectedFile(e.dataTransfer.files?.item(0) ?? null);
	};

	const handleSubmit = async () => {
		if (!file) {
			toast.error("Selecciona un archivo antes de subirlo.")
			return
		}

		try {
			const submitResponse: SubmitCurriculumResponse = await toast.promise(curriculumProvider.submitCurriculum(file), {
				loading: "Subiendo archivo...",
				success: (submitResponse: SubmitCurriculumResponse) => {
					return `Archivo cargado exitósamente: ${submitResponse.metadata.school}`
				},
				error: "No se pudo cargar el archivo. Intenta de nuevo."
			}).unwrap()

			onClose()

			await toast.promise(curriculumProvider.awaitCurriculumParsing(submitResponse.curriculumCreationJobId), {
				loading: "Procesando programación de asignaturas",
				success: () => "Programación de asignaturas procesada exitósamente!",
				error: "Ocurrió un error al generar la programación de asignaturas. Intenta de nuevo.",
			}).unwrap()

			await toast.promise(catalogProvider.awaitCatalogRefresh(submitResponse.catalogRefreshJobId), {
				loading: "Actualizando catalogo",
				success: "Catalogo actualizado!",
				error: "No se pudo actualizar el catalogo. Intenta de nuevo."
			}).unwrap()
		} catch (error) {
			toast.error("No se pudo subir el archivo. Intenta de nuevo.")
		}
	}

	return isOpen && (
		<div className="fixed inset-0 flex flex-col items-center justify-center w-full bg-black/25 z-40 select-none" onClick={onClose}>
			<dialog
				className="z-50 flex flex-col items-center justify-center w-3/4 md:w-1/2 lg:w-1/3 m-auto p-4
				rounded-lg shadow-lg bg-surface text-center"
				onClick={(e) => {
					e.stopPropagation()
				}}>
				<section about={"upload-info"} className="flex flex-col justify-center items-center">
					<h2 className="text-heading">Sube tu programación de asignaturas</h2>
					<br />
					<p>lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet lorem ipsum dolor sit amet</p>
					<div className="bg-green-700/50 border border-green-300 m-2 p-3 rounded-md text-left">
						<Info className="inline w-4 h-4 mr-2 text-green-300" />
						<p className="inline text-green-300">
							No recolectamos tus datos personales de los archivos que subes a la plataforma.
						</p>
					</div>
				</section>
				<hr className="w-full my-2 text-foreground-muted"/>
				<section about="upload" className="flex flex-col justify-center items-center">
					<p>Para subir archivos y puedas planificar con el horario de tu carrera:</p>
					<ul className="list-none list-inside w-3/4 text-left text-foreground-muted">
						<li>Ingresa a la plataforma SUM</li>
						<li>Ve al men&uacute; lateral/Matr&iacute;cula/Programaci&oacute;n de Asignaturas </li>
						<li>Descarga tu programación de asignaturas</li>
						<li>Sube el archivo a esta p&aacute;gina</li>
					</ul>
					<label
						className={`flex flex-col justify-center items-center gap-2 w-full h-32 m-4 border rounded-md border-dashed
						cursor-pointer transition duration-200 ease-in-out ${
							isDragging
								? "border-accent text-foreground bg-accent/10"
								: "border-foreground-muted/75 text-foreground-muted/75 hover:border-foreground-muted hover:text-foreground-muted"
						}`}
						id="upload-label"
						onDragOver={handleDragOver}
						onDragLeave={handleDragLeave}
						onDrop={handleDrop}
					>
						<input
							type="file"
							accept=".pdf"
							onChange={handleFileChange}
							name={"upload-label"}
							className="border border-gray-300 rounded p-2 w-full mb-4 hidden"
						/>
						<Upload size={64}/>
						<span>
							{file
								? <>Archivo: {file.name}</>
								: <>A&uacute;n no ha subido un archivo<br />
									Arrastra tu archivo aca o haz click para buscarlo!</>
							}
						</span>
					</label>
					<div className="flex flex-row justify-around items-center gap-2">
						<button
							className="px-4 py-2 rounded-md bg-accent/75 hover:bg-accent border border-transparent
							disabled:bg-accent/50 enabled:cursor-pointer transition duration-100 ease-in-out"
							disabled={!file}
							onClick={handleSubmit}
						>
							Subir archivo
						</button>
						<button
							className="px-4 py-2 rounded-md bg-surface-muted/50 hover:bg-surface-muted border border-transparent
							cursor-pointer transition duration-100 ease-in-out"
							onClick={onClose}
						>
							Cancelar
						</button>
					</div>
				</section>
			</dialog>
		</div>
	);
}

export default UploadCurriculumModal
