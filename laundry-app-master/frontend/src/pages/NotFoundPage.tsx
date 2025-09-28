import Layout from "../components/layout/Layout.tsx";
import {LuCloudLightning} from "react-icons/lu";

export default function NotFoundPage() {
  return (
    <Layout>
      <div>
        <h1 className="flex-text" style={{gap: '.75rem'}}>
          404 <LuCloudLightning/>
        </h1>
        <h2>
          Page Not Found
        </h2>

        <p>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="button-container">
          <button className="secondary-button" onClick={() => window.history.back()}>
            Go Back
          </button>
          <button className="primary-button" onClick={() => window.location.href = '/'}>
            Home Page
          </button>
        </div>
      </div>
    </Layout>
  )
}
