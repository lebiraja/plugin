import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FileCard from "./FileCard";

describe("FileCard", () => {
  it("renders filename, formatted size, and chunk count", () => {
    render(
      <FileCard filename="report.pdf" size={2048} type="application/pdf" chunks={5} />
    );
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    expect(screen.getByText(/5 chunks/)).toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", () => {
    const onRemove = vi.fn();
    render(<FileCard filename="a.txt" size={100} onRemove={onRemove} />);
    fireEvent.click(screen.getByTitle("Remove file"));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});
