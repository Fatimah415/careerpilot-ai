import json
import os
import re

class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end = False
        self.skill_name = None

class Trie:
    def __init__(self):
        self.root = TrieNode()
        self.size = 0
    
    def insert(self, skill: str) -> None:
        node = self.root
        for char in skill.lower():
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        if not node.is_end:
            self.size += 1
            node.is_end = True
            node.skill_name = skill
    
    def search(self, word: str):
        node = self.root
        for char in word.lower():
            if char not in node.children:
                return None
            node = node.children[char]
        return node.skill_name if node.is_end else None
    
    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for char in prefix.lower():
            if char not in node.children:
                return False
            node = node.children[char]
        return True
    
    def extract_skills(self, text: str) -> list:
        tokens = re.split(r'[\s,;.()\[\]/\'"]+', text.lower())
        found = set()
        for token in tokens:
            token = token.strip()
            if not token or len(token) < 2:
                continue
            match = self.search(token)
            if match:
                found.add(match)
        return sorted(found)

def build_skill_trie(skills_path: str = None):
    if skills_path is None:
        skills_path = os.path.join(os.path.dirname(__file__), "skills.json")
    
    trie = Trie()
    
    if not os.path.exists(skills_path):
        print(f"skills.json not found at {skills_path}")
        return trie
    
    with open(skills_path, "r", encoding="utf-8") as f:
        skills_data = json.load(f)
    
    for category, skills in skills_data.items():
        for skill in skills:
            trie.insert(skill)
    
    print(f"Loaded {trie.size} skills into Trie")
    return trie

SKILL_TRIE = build_skill_trie()

if __name__ == "__main__":
    print(f"Trie size: {SKILL_TRIE.size}")
    print(f"Search 'python': {SKILL_TRIE.search('python')}")
    print(f"Search 'SQL': {SKILL_TRIE.search('sql')}")
    print(f"Starts with 'py': {SKILL_TRIE.starts_with('py')}")
    
    sample_cv = "I am a Python developer with React, SQL and Docker experience."
    print(f"Found skills: {SKILL_TRIE.extract_skills(sample_cv)}")