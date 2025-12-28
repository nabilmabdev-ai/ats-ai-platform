
import os

target_file = r"apps\backend-ai\main.py"

with open(target_file, "rb") as f:
    content = f.read()

# Marker at the end of the last valid function
marker = b'raise HTTPException(status_code=500, detail=str(e))'
idx = content.rfind(marker)

if idx != -1:
    # Find the newline after the marker
    end_of_line = content.find(b'\n', idx)
    if end_of_line != -1:
        # Keep everything up to that newline
        clean_content = content[:end_of_line+1]
        
        # Append the safe block in UTF-8
        append_code = (
            b'\n\n'
            b'if __name__ == "__main__":\n'
            b'    import uvicorn\n'
            b'    # This block is critical for Windows multiprocessing support (spawn)\n'
            b'    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)\n'
        )
        
        with open(target_file, "wb") as f_out:
            f_out.write(clean_content + append_code)
        print("Successfully repaired main.py")
    else:
        print("Error: Could not find newline after marker.")
else:
    print("Error: Could not find marker in file.")
