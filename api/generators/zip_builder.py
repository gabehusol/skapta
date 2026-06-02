import io
import zipfile


def build_zip(files: dict[str, str], project_name: str) -> io.BytesIO:
    """Packs all files into a ZIP with everything nested under project_name/."""
    buf = io.BytesIO()

    with zipfile.ZipFile(buf, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for filepath, content in files.items():
            arcname = f"{project_name}/{filepath}"
            zf.writestr(arcname, content)

    buf.seek(0)
    return buf
