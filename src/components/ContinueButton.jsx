import { useNavigate } from "react-router-dom";

const ContinueButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/feed")}
      className="button continue"
    >
      Continue To App
    </button>
  );
};

export default ContinueButton;