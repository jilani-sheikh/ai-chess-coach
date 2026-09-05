"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { uploadPgnAction } from "@/lib/actions/games";
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadPgnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadPgnModal({ isOpen, onClose, onSuccess }: UploadPgnModalProps) {
  const [pgnText, setPgnText] = useState("");
  const [userColor, setUserColor] = useState<"WHITE" | "BLACK">("WHITE");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".pgn") && !file.name.endsWith(".txt")) {
      setError("Please select a valid .pgn or .txt file.");
      return;
    }
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPgnText(content || "");
    };
    reader.readAsText(file);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pgnText.trim()) {
      setError("Please provide PGN file content or text.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const result = await uploadPgnAction(pgnText, userColor);
    setIsUploading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setPgnText("");
        setUserColor("WHITE");
        setFileName(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setError(result.error || "Failed to upload PGN.");
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
          className="relative w-full max-w-xl bg-[#13131a] border border-[rgba(223,180,108,0.25)] rounded-2xl p-6 sm:p-8 shadow-2xl shadow-[rgba(223,180,108,0.1)] text-zinc-100"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[#dfb46c]/15 border border-[#dfb46c]/30 flex items-center justify-center text-[#dfb46c]">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">Upload PGN Game</h2>
              <p className="text-xs text-zinc-400">
                Import your chess games from Chess.com, Lichess, or PGN files.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-white">Game Uploaded!</h3>
              <p className="text-sm text-zinc-400">Your game was validated and saved successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#dfb46c] bg-[#dfb46c]/10"
                    : "border-zinc-800 hover:border-[#dfb46c]/50 bg-zinc-900/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pgn,.txt"
                  onChange={handleInputChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-[#dfb46c]">
                    <FileText className="w-5 h-5" />
                  </div>
                  {fileName ? (
                    <div>
                      <p className="text-sm font-semibold text-[#dfb46c]">{fileName}</p>
                      <p className="text-xs text-zinc-500">File loaded ready for parsing</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        Drop your <span className="text-[#dfb46c]">.PGN</span> file here, or click to browse
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">Supports standard PGN format up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw PGN Text Area */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Or Paste PGN Text:
                </label>
                <textarea
                  value={pgnText}
                  onChange={(e) => {
                    setPgnText(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={`[Event "Casual Game"]\n[Site "Lichess.org"]\n[White "Jilani.S"]\n[Black "Opponent"]\n[Result "1-0"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 1-0`}
                  rows={4}
                  className="w-full bg-[#0b0b0e] border border-zinc-800 focus:border-[#dfb46c] rounded-xl p-3.5 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-[#dfb46c]"
                />
              </div>

              {/* User Side Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Which side did you play?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserColor("WHITE")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      userColor === "WHITE"
                        ? "bg-[#dfb46c]/20 border-[#dfb46c] text-[#f4d084] shadow-sm"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-zinc-400 inline-block shrink-0" />
                    White Pieces
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserColor("BLACK")}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      userColor === "BLACK"
                        ? "bg-[#dfb46c]/20 border-[#dfb46c] text-[#f4d084] shadow-sm"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-zinc-950 border border-zinc-600 inline-block shrink-0" />
                    Black Pieces
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-white text-sm font-medium hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !pgnText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gold-gradient hover:opacity-90 disabled:opacity-50 text-[#0b0b0e] font-semibold text-sm shadow-lg shadow-[rgba(223,180,108,0.2)] flex items-center gap-2 transition-all"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating PGN...
                    </>
                  ) : (
                    "Upload Game"
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
