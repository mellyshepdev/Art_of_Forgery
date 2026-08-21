import tkinter as tk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk, ImageDraw, ImageFont

class CardEditor:
    def __init__(self, root):
        self.root = root
        self.root.title("Custom Card Generator")

        # Core Data Structures
        self.template_path = None
        self.base_image = None
        self.display_image = None
        
        # Define coordinates for regions (x1, y1, x2, y2)
        # Update these bounding boxes to match your exact template layout
        self.regions = {
            1: {"box": (20, 20, 80, 80), "type": "text", "content": "100"},
            2: {"box": (100, 20, 300, 60), "type": "text", "content": "CARD TITLE"},
            8: {"box": (50, 100, 350, 400), "type": "image", "content": None},
            # Add remaining sections up to 18 here
        }

        # UI Setup
        self.setup_ui()

    def setup_ui(self):
        # Control Panel
        control_frame = tk.Frame(self.root)
        control_frame.pack(side=tk.TOP, fill=tk.X, padx=10, pady=5)

        btn_load = tk.Button(control_frame, text="Load Template", command=self.load_template)
        btn_load.pack(side=tk.LEFT, padx=5)

        btn_export = tk.Button(control_frame, text="Export Card", command=self.export_card)
        btn_export.pack(side=tk.LEFT, padx=5)

        # Canvas for Card Display
        self.canvas = tk.Canvas(self.root, width=400, height=600, bg="gray")
        self.canvas.pack(side=tk.TOP, pady=10)
        self.canvas.bind("<Button-1>", self.on_canvas_click)

    def load_template(self):
        file_path = filedialog.askopenfilename(filetypes=[("Image Files", "*.png *.jpg *.jpeg")])
        if file_path:
            self.template_path = file_path
            self.base_image = Image.open(file_path).convert("RGBA")
            self.update_canvas()

    def update_canvas(self):
        if not self.base_image:
            return

        # Create composite image
        composite = self.base_image.copy()
        draw = ImageDraw.Draw(composite)

        # Draw regions and current content
        for region_id, data in self.regions.items():
            box = data["box"]
            if data["type"] == "text" and data["content"]:
                draw.text((box[0], box[1]), str(data["content"]), fill="white")
            elif data["type"] == "image" and data["content"]:
                overlay = Image.open(data["content"]).convert("RGBA")
                overlay = overlay.resize((box[2] - box[0], box[3] - box[1]))
                composite.paste(overlay, (box[0], box[1]), overlay)

        # Render to Tkinter Canvas
        self.display_image = ImageTk.PhotoImage(composite)
        self.canvas.config(width=composite.width, height=composite.height)
        self.canvas.create_image(0, 0, anchor=tk.NW, image=self.display_image)

    def on_canvas_click(self, event):
        x, y = event.x, event.y
        for region_id, data in self.regions.items():
            x1, y1, x2, y2 = data["box"]
            if x1 <= x <= x2 and y1 <= y <= y2:
                self.edit_region(region_id)
                break

    def edit_region(self, region_id):
        region = self.regions[region_id]
        if region["type"] == "text":
            new_text = tk.simpledialog.askstring("Input", f"Enter text for region {region_id}:")
            if new_text is not None:
                region["content"] = new_text
                self.update_canvas()
        elif region["type"] == "image":
            img_path = filedialog.askopenfilename(filetypes=[("Image Files", "*.png *.jpg")])
            if img_path:
                region["content"] = img_path
                self.update_canvas()

    def export_card(self):
        if not self.base_image:
            messagebox.showwarning("Warning", "Load a template first!")
            return

        save_path = filedialog.asksaveasfilename(defaultextension=".png", filetypes=[("PNG Files", "*.png")])
        if save_path:
            # Generate final high-res output
            output = self.base_image.copy()
            draw = ImageDraw.Draw(output)

            for region_id, data in self.regions.items():
                box = data["box"]
                if data["type"] == "text" and data["content"]:
                    draw.text((box[0], box[1]), str(data["content"]), fill="white")
                elif data["type"] == "image" and data["content"]:
                    overlay = Image.open(data["content"]).convert("RGBA")
                    overlay = overlay.resize((box[2] - box[0], box[3] - box[1]))
                    output.paste(overlay, (box[0], box[1]), overlay)

            output.save(save_path)
            messagebox.showinfo("Success", f"Card exported to {save_path}")

if __name__ == "__main__":
    root = tk.Tk()
    app = CardEditor(root)
    root.mainloop()