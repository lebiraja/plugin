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
      return <FileText className="w-5 h-5 text-accent-red" />;
    if (type.includes("image"))
      return <Image className="w-5 h-5 text-primary" />;
    if (type.includes("video"))
      return <Video className="w-5 h-5 text-accent-purple" />;
    if (type.includes("audio"))
      return <Music className="w-5 h-5 text-accent-green" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="w-5 h-5 text-accent-yellow" />;
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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm bg-liquid-frosted border border-liquid-border backdrop-blur-sm"
      >
        {getFileIcon()}
        <span className="truncate max-w-[200px] text-gray-200">{filename}</span>
        <span className="text-xs text-gray-500">{formatSize(size)}</span>
        {onRemove && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemove}
            className="p-0.5 hover:bg-liquid-hover rounded transition-colors"
            title="Remove file"
          >
            <X className="w-3 h-3 text-gray-400" />
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="flex items-start gap-3 p-3 rounded-xl bg-liquid-frosted border border-liquid-border backdrop-blur-sm hover:border-primary/30 hover:shadow-glow transition-all"
    >
      <div className="flex-shrink-0 p-2 rounded-lg bg-liquid-hover">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate text-gray-200">{filename}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span>{formatSize(size)}</span>
          {chunks !== undefined && chunks > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-600"></span>
              <span>{chunks} chunks</span>
            </>
          )}
        </div>
      </div>
      {onRemove && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onRemove}
          className="flex-shrink-0 p-1.5 hover:bg-accent-red/20 rounded-lg transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4 text-accent-red" />
        </motion.button>
      )}
    </motion.div>
  );
};

export default FileCard;
