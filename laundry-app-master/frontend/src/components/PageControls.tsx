import styles from "./PageControls.module.css";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {Button} from "./Button.tsx";

export function PageControls({page, setPage, array}: {
  page: number,
  setPage: (page: number) => void,
  array: unknown[],
}) {
  return (
    <>
      {(array.length >= 20 || page !== 0) && (
        <div className={styles.pageControls}>
          <Button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <div className="flex-text">
              <FaChevronLeft size={16}/>
            </div>
          </Button>
          <Button variant="empty" className={styles.pageNumber}>
            Page {page + 1}
          </Button>
          <Button
            disabled={array.length < 20}
            onClick={() => setPage(page + 1)}
          >
            <div className="flex-text">
              <FaChevronRight size={16}/>
            </div>
          </Button>
        </div>
      )}
    </>
  )
}
