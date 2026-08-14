import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EXPLORER } from "@/lib/contracts";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hash: string;
  title?: string;
  description?: string;
}

export function TransactionDialog({
  open,
  onOpenChange,
  hash,
  title = "Transaksi berhasil!",
  description = "Transaksimu sudah masuk ke jaringan.",
}: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-emerald-600">✅ {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <p className="mb-2 text-sm font-medium">Hash transaksi</p>
            <p className="font-mono text-xs break-all text-muted-foreground">{hash}</p>
          </div>

          <div className="flex flex-col gap-2">
            <a
              className="w-full"
              href={`${EXPLORER}/tx/${hash}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Button className="w-full">Lihat di BscScan →</Button>
            </a>
            <Button className="w-full" variant="outline" onClick={() => onOpenChange(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
