use std::collections::{HashMap, HashSet};
use crate::types::{ProcessInfo, ProcessTree, ProcessTreeNode};

impl ProcessTree {
    pub fn build(processes: Vec<ProcessInfo>, root_pid: Option<u32>) -> Self {
        let mut nodes: HashMap<u32, ProcessTreeNode> = HashMap::new();
        let mut parent_to_children: HashMap<u32, Vec<u32>> = HashMap::new();

        for p in &processes {
            parent_to_children.entry(p.ppid).or_default().push(p.pid);
        }

        for p in processes {
            let pid = p.pid;
            let children = parent_to_children.remove(&pid).unwrap_or_default();
            nodes.insert(pid, ProcessTreeNode { info: p, children });
        }

        let effective_root = root_pid.unwrap_or(1);
        Self {
            root_pid: effective_root,
            nodes,
        }
    }

    pub fn children_of(&self, pid: u32) -> Vec<&ProcessInfo> {
        if let Some(node) = self.nodes.get(&pid) {
            node.children.iter().filter_map(|c_pid| self.nodes.get(c_pid).map(|n| &n.info)).collect()
        } else {
            Vec::new()
        }
    }

    pub fn descendants_of(&self, pid: u32) -> Vec<u32> {
        let mut desc = Vec::new();
        let mut visited = HashSet::new();
        visited.insert(pid);
        let mut stack = vec![pid];
        while let Some(current) = stack.pop() {
            if let Some(node) = self.nodes.get(&current) {
                for &child in &node.children {
                    if visited.insert(child) {
                        desc.push(child);
                        stack.push(child);
                    }
                }
            }
        }
        desc
    }

    pub fn render_ascii(&self) -> String {
        let mut output = String::new();
        let mut visited = HashSet::new();
        self.render_node(self.root_pid, 0, &mut visited, &mut output);
        output
    }

    fn render_node(&self, pid: u32, depth: usize, visited: &mut HashSet<u32>, output: &mut String) {
        if !visited.insert(pid) {
            return;
        }
        if let Some(node) = self.nodes.get(&pid) {
            let indent = "  ".repeat(depth);
            output.push_str(&format!("{}[{}] {} (State: {:?})\n", indent, node.info.pid, node.info.name, node.info.state));
            for &child in &node.children {
                self.render_node(child, depth + 1, visited, output);
            }
        }
    }
}
