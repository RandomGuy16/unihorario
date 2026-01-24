import { FileUp } from 'lucide-react';

interface UploadPDFButtonProps {
  setOpen: (open: boolean) => void;
}
function UploadPDFButton({ setOpen }: UploadPDFButtonProps & { children?: never}) {
  return (
    <button className='inline-block border border-border p-1 rounded-sm cursor-pointer' onClick={() => setOpen(true)}>
      <FileUp />
    </button>
  )
}

export default UploadPDFButton;
