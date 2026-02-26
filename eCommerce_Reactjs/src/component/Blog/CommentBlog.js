import React from "react";

function CommentBlog(props) {
  return (
    <div
      className={`d-flex mb-3 ${
        props.isMe ? "justify-content-end" : "justify-content-start"
      }`}
    >
      <div
        className={`d-flex align-items-start ${
          props.isMe ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <img
          src={props.img}
          alt="avatar"
          className="rounded-circle mx-2"
          width="45"
          height="45"
        />

        {/* Nội dung comment */}
        <div
          className={`p-3 rounded-4 ${props.isMe ? "bg-light" : "bg-light"}`}
          style={{ maxWidth: "450px" }}
        >
          <div className="fw-bold small mb-1">{props.name}</div>

          <div className="mb-1">{props.content}</div>

          <div className="text-muted small">{props.date}</div>
        </div>
      </div>
    </div>
  );
}

export default CommentBlog;
