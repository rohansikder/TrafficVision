import numpy as np
from ultralytics import YOLO
import cv2
import os

os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

# Load YOLOv8 model
model = YOLO('yolov8n.pt')

# Load video
cap = cv2.VideoCapture('./Cars.mp4')

ret = True

trackIDs = []

while ret:
    ret, frame = cap.read()

    if ret:
        # Run YOLOv8 tracking on the frame, persisting tracks between frames
        results = model.track(frame, persist=True, classes=2, stream=True)

        boxes = results[0].boxes.xyxy.cpu()
        trackIDs = results[0].boxes.id.int().cpu().tolist()
        for result in results:
            id = result.boxes.id
            print('ID: ', id)

        # Visualize the results on the frame
        annotated_frame = results[0].plot()

        # Display the annotated frame
        cv2.imshow("YOLOv8 Tracking", annotated_frame)

        # Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

# Release video capture and close the OpenCV window
cap.release()
cv2.destroyAllWindows()

# Write all car IDs to a text file
with open('car_ids.txt', 'w') as car_ids_file:
    for car_id in trackIDs:
        car_ids_file.write(f"Car ID: {car_id}\n")
