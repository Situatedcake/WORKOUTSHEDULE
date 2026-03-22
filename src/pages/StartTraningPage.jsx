import { Link } from "react-router";
import NavMenu from "../components/NavMenu";

export default function StartTraningPage() {
  return (
    <>
      <div>
        <Link to="/">back</Link>
        <h1>План тренировки</h1>
        <button>menu</button>
      </div>

      <div>
        <img src="" alt="clock" />
        <span>85 минут</span>
        <p>~рассчитанное время</p>
        <div>diffclt</div>
      </div>

      <section>
        <div id="Упражнение"></div>
      </section>
      <NavMenu />
    </>
  );
}
