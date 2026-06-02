import { FileText, File, Image, Video, Music, Archive, X } from "lucide-react";
import { motion } from "framer-motion";

interface FileCardProps {
  filename: string;
  size: number;
  type?: string;
  chunks?: number;
  onRemove?: () => void;
  compact?: boolean;
}

const FileCard: React.FC<FileCardProps> = ({
  filename,
  size,
  type,
  chunks,
  onRemove,
  compact = false,
}) => {
  const getFileIcon = () => {
    if (!type) return <File className="w-5 h-5 text-gray-400" />;

    if (type.includes("pdf"))
      return <FileText className="w-5 h-5 text-apple-red" />;
    if (type.includes("image"))
      return <Image className="w-5 h-5 text-primary" />;
    if (type.includes("video"))
      return <Video className="w-5 h-5 text-apple-purple" />;
    if (type.includes("audio"))
      return <Music className="w-5 h-5 text-apple-green" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="w-5 h-5 text-apple-yellow" />;
    if (type.includes("text"))
      return <FileText className="w-5 h-5 text-gray-400" />;

    return <File className="w-5 h-5 text-gray-400" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 text-sm"
      >
        {getFileIcon()}
        <span className="max-w-[200px] truncate">{filename}</span>
        <span className="font-mono text-xs text-muted-foreground">{formatSize(size)}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-accent"
            title="Remove file"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
    >
      <div className="shrink-0 rounded-md bg-muted p-2">{getFileIcon()}</div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium">{filename}</h4>
        <div className="mt-1 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{formatSize(size)}</span>
          {chunks !== undefined && chunks > 0 && <span>· {chunks} chunks</span>}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 rounded-md p-1.5 transition-colors hover:bg-accent"
          title="Remove file"
        >
          <X className="h-4 w-4 text-destructive" />
        </button>
      )}
    </motion.div>
  );
};

export default FileCard;
