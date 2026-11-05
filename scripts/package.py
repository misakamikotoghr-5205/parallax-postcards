"""Create a deterministic itch.io HTML game ZIP with index.html at its root."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

project = Path(__file__).resolve().parent.parent
files = ["index.html", "styles.css", "app.js", "world.js", "renderer.js", "LICENSE"]
output = project / "releases" / "parallax-postcards-html.zip"
output.parent.mkdir(exist_ok=True)
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for name in files:
        info = ZipInfo(name, date_time=(2026, 11, 5, 0, 0, 0))
        info.compress_type = ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (project / "dist" / name).read_bytes())
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert archive.namelist() == files
print(f"Packaged {output.name}: {output.stat().st_size:,} bytes; index.html at ZIP root.")
