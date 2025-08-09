'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  firmName: string | null;
}

const FirmDetailsDialog: React.FC<Props> = ({ open, setOpen, firmName }) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Firm Details</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-gray-700">
          <p><strong>Firm Name:</strong> {firmName}</p>
          <Separator className="my-3" />
          <p>
            Additional information about <strong>{firmName}</strong> goes here.
            This can include company address, contacts, staff, and more.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FirmDetailsDialog;
