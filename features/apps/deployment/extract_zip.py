"""校验源码 ZIP 并解压到空工作目录，仅使用 Python 标准库。"""
import pathlib
import stat
import sys
import zipfile

MAX_SIZE = 1024 * 1024 * 1024
IGNORED = {"__MACOSX", ".DS_Store", ".git", "node_modules", ".venv", "venv", ".next"}


def extract(archive, destination):
    root = pathlib.Path(destination).resolve()
    with zipfile.ZipFile(archive) as source:
        entries = source.infolist()
        if len(entries) > 20000 or sum(item.file_size for item in entries) > MAX_SIZE:
            raise ValueError("源码包解压后过大或文件数量过多")
        files = []
        seen = set()
        for item in entries:
            name = item.filename.replace("\\", "/")
            relative = pathlib.PurePosixPath(name)
            if relative.is_absolute() or ".." in relative.parts or ":" in name or "\x00" in name:
                raise ValueError("源码包包含不安全的文件路径")
            mode = item.external_attr >> 16
            if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) and not (stat.S_ISREG(mode) or stat.S_ISDIR(mode))):
                raise ValueError("源码包不能包含符号链接或特殊文件")
            if item.flag_bits & 1:
                raise ValueError("不支持加密源码包")
            if any(part in IGNORED for part in relative.parts) or item.is_dir():
                continue
            if name in seen:
                raise ValueError("源码包包含重复文件")
            seen.add(name)
            files.append((item, relative))
        if not files:
            raise ValueError("源码包没有可部署的文件")
        first = files[0][1].parts[0]
        strip_root = all(len(relative.parts) > 1 and relative.parts[0] == first for _, relative in files)
        total = 0
        for item, relative in files:
            parts = relative.parts[1:] if strip_root else relative.parts
            target = root.joinpath(*parts)
            target.parent.mkdir(parents=True, exist_ok=True)
            with source.open(item) as incoming, target.open("xb") as outgoing:
                while chunk := incoming.read(1024 * 1024):
                    total += len(chunk)
                    if total > MAX_SIZE:
                        raise ValueError("源码包解压后过大")
                    outgoing.write(chunk)
            if item.external_attr >> 16 & 0o111:
                target.chmod(0o700)


if __name__ == "__main__":
    try:
        extract(sys.argv[1], sys.argv[2])
    except (ValueError, OSError, zipfile.BadZipFile, RuntimeError) as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
