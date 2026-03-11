import { FileUp } from 'lucide-react';

interface UploadPDFButtonProps {
  setOpen: (open: boolean) => void;
}
function UploadPDFButton({ setOpen }: UploadPDFButtonProps & { children?: never }) {
  return (
    <button
      className='
        upload-pdf-button
        flex flex-row justify-center items-center gap-1
        border border-border/70 p-1 rounded-sm cursor-pointer
        shadow-elev-1 hover:shadow-elev-2 active:border-border-strong'
      onClick={() => setOpen(true)}
      title={'Sube tu programación de asignaturas'}
    >
      <span className='inline-block text-control'>Subir programacion</span>
      <FileUp size={16} />
    </button>
  )
}

export default UploadPDFButton;
