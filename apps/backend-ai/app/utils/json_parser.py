import json
import re
import logging

logger = logging.getLogger("uvicorn")

def clean_and_parse_json(text: str):
    """
    Robust JSON parser that handles LLM noise, markdown blocks, and embedded objects.
    Attributes:
        text (str): The raw text from the LLM.
    Returns:
        dict/list: Parsed JSON object.
    """
    # 1. Attempt Clean Parse first (Fast Path)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Cleanup Markdown Code Blocks
    # Remove ```json ... ``` wrappers
    text = re.sub(r'^```(\w+)?\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
    
    # 3. Aggressive Strip (sometimes leading text exists)
    candidate = text.strip()

    # 4. Braced-Counting Extractor
    # Finds the first outer-most JSON object or array and extracts it exactly.
    try:
        start_index = -1
        stack = []
        in_string = False
        escape = False
        
        # Locate first valid opener
        for i, char in enumerate(candidate):
            if char == '{' or char == '[':
                start_index = i
                stack.append(char)
                break
        
        if start_index == -1:
            raise ValueError("No JSON start found")

        for i in range(start_index + 1, len(candidate)):
            char = candidate[i]
            
            # Handle String State (ignore braces inside strings)
            if char == '"' and not escape:
                in_string = not in_string
            
            if char == '\\':
                escape = not escape
            else:
                escape = False
            
            if in_string:
                continue

            # Handle Structural Braces
            if char == '{' or char == '[':
                stack.append(char)
            elif char == '}' or char == ']':
                if stack:
                    last = stack[-1]
                    if (char == '}' and last == '{') or (char == ']' and last == '['):
                        stack.pop()
                        # If stack is empty, we found the closing brace of the root object
                        if not stack:
                            final_json_text = candidate[start_index : i + 1]
                            return json.loads(final_json_text)
                    else:
                        # Mismatched brace - might be malformed
                        break
    except Exception:
        pass # Fallback to loose regex

    # 5. Fallback: Loose Regex for { ... }
    try:
        start = candidate.find('{')
        end = candidate.rfind('}')
        if start != -1 and end != -1:
            return json.loads(candidate[start:end+1])
    except:
        pass
    
    # 6. Last Resort: Log and Fail
    logger.error(f"Failed to parse JSON: {text[:500]}...")
    try:
        with open("json_parse_error.log", "a", encoding="utf-8") as f:
            f.write(f"--- FAILED JSON PARSE ---\n{text}\n-------------------------\n")
    except:
        pass

    raise ValueError("Failed to parse AI response")
