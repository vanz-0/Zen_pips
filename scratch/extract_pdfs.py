import PyPDF2
import os

def pdf_to_markdown(pdf_path, output_path):
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            text = f"# Source: {os.path.basename(pdf_path)}\n\n"
            for page in reader.pages:
                text += page.extract_text() + "\n\n"
            
            with open(output_path, 'w', encoding='utf-8') as out:
                out.write(text)
            return True
    except Exception as e:
        print(f"Error processing {pdf_path}: {e}")
        return False

# Example usage for one of the identified PDFs
pdf1 = r"c:\Users\Admin\OneDrive\Desktop\ZENPIPS\zenpips-web\zain_brain\raw\processed\ZenPips_Institutional_Guide.pdf"
out1 = r"c:\Users\Admin\OneDrive\Desktop\ZENPIPS\zenpips-web\zain_brain\wiki\concepts\Institutional_Guide_Extracted.md"

if os.path.exists(pdf1):
    os.makedirs(os.path.dirname(out1), exist_ok=True)
    pdf_to_markdown(pdf1, out1)
