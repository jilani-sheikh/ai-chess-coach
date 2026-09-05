"use client";

import { useState } from "react";
import { deleteGameAction } from "@/lib/actions/games";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteGameModalProps {
  isOpen: boolean;
  gameId: string | null;
  matchTitle?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteGameModal({
  isOpen,
  gameId,
  matchTitle,
  onClose,
  onSuccess,
}: DeleteGameModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !gameId) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const res = await deleteGameAction(gameId);
    setIsDeleting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to delete game.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#13131a] border border-red-900/40 rounded-2xl p-6 shadow-2xl shadow-red-950/20 text-zinc-100"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold text-white">Delete Game</h3>
              <p className="text-xs text-zinc-400">This action cannot be undone.</p>
            </div>
          </div>

          <p className="text-sm text-zinc-300 mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-white">{matchTitle || "this game"}</span>? It will be permanently removed from your account.
          </p>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs mb-4">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white text-sm font-medium hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-red-900/30 disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Game
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
