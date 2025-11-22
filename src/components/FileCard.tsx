import { FileText, File, Image, Video, Music, Archive, X } from "lucide-react";

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
    if (!type) return <File className="w-5 h-5" />;

    if (type.includes("pdf"))
      return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes("image"))
      return <Image className="w-5 h-5 text-blue-500" />;
    if (type.includes("video"))
      return <Video className="w-5 h-5 text-purple-500" />;
    if (type.includes("audio"))
      return <Music className="w-5 h-5 text-green-500" />;
    if (type.includes("zip") || type.includes("rar"))
      return <Archive className="w-5 h-5 text-yellow-500" />;
    if (type.includes("text"))
      return <FileText className="w-5 h-5 text-gray-500" />;

    return <File className="w-5 h-5" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-glass-bg border border-glass-border rounded-lg text-sm">
        {getFileIcon()}
        <span className="truncate max-w-[200px]">{filename}</span>
        <span className="text-xs text-gray-400">{formatSize(size)}</span>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-0.5 hover:bg-glass-hover rounded transition-colors"
            title="Remove file"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 bg-glass-bg border border-glass-border rounded-lg hover:border-primary/50 transition-colors">
      <div className="flex-shrink-0 p-2 bg-glass-hover rounded-lg">
        {getFileIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm truncate">{filename}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          <span>{formatSize(size)}</span>
          {chunks !== undefined && chunks > 0 && (
            <>
              <span>•</span>
              <span>{chunks} chunks</span>
            </>
          )}
        </div>
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 hover:bg-glass-hover rounded transition-colors"
          title="Remove file"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FileCard;
