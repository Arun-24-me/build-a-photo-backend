import axios from "axios";
import User from "../models/userModel.js";
import FormData from "form-data";

export const generateImage = async (req, res) => {
  try {
    const userId = req.userId;
    const { prompt } = req.body;

    if (!userId || !prompt) {
      return res.json({
        success: false,
        message: "Missing details",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    if (user.creditbalance <= 0) {
      return res.json({
        success: false,
        message: "No credit balance",
        creditbalance: user.creditbalance,
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt);

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          "x-api-key": process.env.CLIPDROP_API,
          ...formData.getHeaders(),
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = Buffer.from(data, "binary").toString("base64");

    const resultImage = `data:image/png;base64,${base64Image}`;

    await User.findByIdAndUpdate(user._id, {
      creditbalance: user.creditbalance - 1,
    });

    res.json({
      success: true,
      message: "Image generated successfully",
      creditbalance: user.creditbalance - 1,
      resultImage,
    });

  } catch (error) {
    console.log(error);

    res.json({
      success: false,
      message: error.message,
    });
  }
};

export default generateImage;