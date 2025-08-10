"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Image from "next/image";
import React from "react";

interface DeleteFirmDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onConfirmDelete: () => void;
}

const DeleteFirmDialog: React.FC<DeleteFirmDialogProps> = ({
  open,
  setOpen,
  onConfirmDelete,
}) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Delete Staff
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-center my-2">
          <Image src="/img1.png" alt="Warning" width={300} height={100} />
        </div>

        <p className="text-sm text-gray-600 px-6">
          Deleting this firm will remove all associated data. Are you sure you
          want to proceed?
        </p>

        {/* Footer with left and right buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            className="border border-gray-400 text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#6587DE] hover:bg-[#5475c4] text-white"
            onClick={onConfirmDelete}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteFirmDialog;
