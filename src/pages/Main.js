import React from 'react';
import styles from './Main.module.css';
import LazyImage from '../components/LazyImage'; // LazyImage 컴포넌트 import
import menu1 from '../assets/images/Menu1.png';
import menu2 from '../assets/images/Menu2.png';
import menu3 from '../assets/images/Menu3.png';

// 물음표 아이콘
const QuestionIcon = () => (
    <div className={styles.questionIcon}>?</div>
);

const Main = () => {
  // 실제 이미지 URL을 여기에 입력합니다.
  // 예시로 placeholder 이미지를 사용합니다.
  const imageUrl1 = 'https://placehold.co/200x200/BF793F/24160F?text=LV.+???';
  const imageUrl2 = 'https://placehold.co/200x200/BF793F/24160F?text=동화+만들기';
  const imageUrl3 = 'https://placehold.co/200x200/BF793F/24160F?text=내가+만든+동화';

  return (
    <div className={styles.mainContainer}>
      <div className={styles.gridContainer}>
        
        {/* Row 1, Col 1: 이미지 1 */}
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <LazyImage src={menu1} alt="" />
                <QuestionIcon />
            </div>
        </div>

        {/* Row 1, Col 2: 공백 */}
        <div></div>

        {/* Row 2, Col 1: 버튼 1 */}
        <div className={styles.card}>
            <button className={styles.button}>다른 사람이랑 같이 놀자! </button>
        </div>

        {/* Row 2, Col 2: 이미지 2 */}
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <LazyImage src={menu2} alt="동화 만들기 곰" />
                 <QuestionIcon />
            </div>
        </div>

        {/* Row 3, Col 1: 이미지 3 */}
        <div className={styles.card}>
             <div className={styles.imageWrapper}>
                <LazyImage src={menu3} alt="내가 만든 동화 곰" />
                 <QuestionIcon />
            </div>
        </div>
        
        {/* Row 3, Col 2: 버튼 2 */}
        <div className={styles.card}>
            <button className={styles.button}>다른 사람 동화 보기</button>
        </div>

      </div>
    </div>
  );
};

export default Main;
