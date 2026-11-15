// Error codes that the gateway adds in front of the backend codes. The app
// shows them in Vietnamese, the same way as backend codes. See
// gateway/docs/gateway.md for when each one is sent.
export const GATEWAY_MESSAGES: Record<string, string> = {
  not_found: "Không tìm thấy nội dung này.",
  method_not_allowed: "Thao tác này không được hỗ trợ.",
  rate_limited: "Bạn thử quá nhiều lần. Vui lòng đợi một lúc rồi thử lại.",
  payload_too_large: "Tệp quá lớn. Hãy chọn tệp nhỏ hơn.",
  upstream_unavailable:
    "Máy chủ đang bận hoặc bảo trì. Vui lòng thử lại sau ít phút.",
  upstream_timeout: "Máy chủ phản hồi quá chậm. Vui lòng thử lại.",
  too_many_sockets: "Có quá nhiều kết nối đang mở. Hãy đóng bớt rồi thử lại.",
  origin_forbidden: "Kết nối này không được phép.",
  upgrade_failed: "Không mở được kết nối trực tiếp. Vui lòng thử lại.",
  internal_error: "Máy chủ gặp lỗi. Vui lòng thử lại sau.",
};

// Keep in step with the codes listed in gateway/AGENTS.md.
export const GATEWAY_CODES = Object.keys(GATEWAY_MESSAGES);
