/// 根据文件扩展名推断 Content-Type
pub fn guess_content_type(filename: &str) -> String {
    let ext = filename.split('.').last().unwrap_or("").to_lowercase();

    match ext.as_str() {
        // 图片
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "bmp" => "image/bmp",
        "ico" => "image/x-icon",

        // 文档
        "pdf" => "application/pdf",
        "doc" => "application/msword",
        "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "xls" => "application/vnd.ms-excel",
        "xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "ppt" => "application/vnd.ms-powerpoint",
        "pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",

        // 文本
        "txt" => "text/plain",
        "md" => "text/markdown",
        "html" | "htm" => "text/html",
        "css" => "text/css",
        "js" => "text/javascript",
        "json" => "application/json",
        "xml" => "text/xml",
        "csv" => "text/csv",

        // 音频
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "ogg" => "audio/ogg",
        "flac" => "audio/flac",

        // 视频
        "mp4" => "video/mp4",
        "avi" => "video/x-msvideo",
        "mov" => "video/quicktime",
        "wmv" => "video/x-ms-wmv",
        "flv" => "video/x-flv",
        "webm" => "video/webm",

        // 压缩文件
        "zip" => "application/zip",
        "rar" => "application/x-rar-compressed",
        "7z" => "application/x-7z-compressed",
        "tar" => "application/x-tar",
        "gz" => "application/gzip",

        // 默认
        _ => "application/octet-stream",
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_guess_content_type() {
        assert_eq!(guess_content_type("test.jpg"), "image/jpeg");
        assert_eq!(guess_content_type("test.png"), "image/png");
        assert_eq!(guess_content_type("test.pdf"), "application/pdf");
        assert_eq!(guess_content_type("test.txt"), "text/plain");
        assert_eq!(guess_content_type("test.mp4"), "video/mp4");
        assert_eq!(
            guess_content_type("test.unknown"),
            "application/octet-stream"
        );
    }
}
