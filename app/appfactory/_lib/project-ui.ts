export type FileTreeNode = {
  name: string;
  path: string;
  type: "folder" | "file";
  changed: boolean;
  children?: FileTreeNode[];
};

export function buildFileTree(
  files: string[],
  changedFiles: string[] = [],
): FileTreeNode[] {
  const changed = new Set(changedFiles);
  const roots: FileTreeNode[] = [];

  for (const filePath of files
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))) {
    const parts = filePath.split("/").filter(Boolean);
    let current = roots;
    let parentPath = "";

    parts.forEach((name, index) => {
      const path = parentPath ? `${parentPath}/${name}` : name;
      const isFile = index === parts.length - 1;
      let node = current.find((item) => item.name === name);
      if (!node) {
        node = {
          name,
          path,
          type: isFile ? "file" : "folder",
          changed: isFile && changed.has(filePath),
          ...(isFile ? {} : { children: [] }),
        };
        current.push(node);
      }
      if (changed.has(filePath)) node.changed = true;
      if (!isFile) current = node.children ?? [];
      parentPath = path;
    });
  }

  const sortNodes = (nodes: FileTreeNode[]) => {
    nodes.sort((left, right) => {
      if (left.type !== right.type) return left.type === "folder" ? -1 : 1;
      return left.name.localeCompare(right.name);
    });
    nodes.forEach((node) => {
      if (node.children) sortNodes(node.children);
    });
  };
  sortNodes(roots);
  return roots;
}

export function defaultFileTab(
  path: string,
  changedFiles: string[] = [],
): "diff" | "content" {
  return changedFiles.includes(path) ? "diff" : "content";
}
