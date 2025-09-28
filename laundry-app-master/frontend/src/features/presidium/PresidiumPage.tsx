import Layout from "../../components/layout/Layout.tsx";
import {usePresidiumMembers} from "./queries.ts";
import {Loading} from "../../components/Loading.tsx";
import styles from "./PresidiumPage.module.css";

export function PresidiumPage() {
  const {data: members, isLoading, isError} = usePresidiumMembers();

  return (
    <Layout>
      <h2>Presidium</h2>
      <p>Resident representatives supporting the Guckelsberg community.</p>
      {isLoading && <Loading/>}
      {isError && <div>Unable to load presidium members right now.</div>}
      {!isLoading && !isError && members && members.length === 0 && (
        <div>No presidium members have been published yet.</div>
      )}
      {!isLoading && !isError && members && members.length > 0 && (
        <div className={styles.grid}>
          {members.map(member => (
            <article key={member.id} className={styles.card}>
              {member.portraitUrl && (
                <img src={member.portraitUrl} alt={member.name} className={styles.portrait}/>
              )}
              <div className={styles.name}>{member.name}</div>
              <div className={styles.title}>{member.title}</div>
              {member.contact && (
                <div className={styles.contact}>{member.contact}</div>
              )}
              {member.bio && (
                <div className={styles.bio}>{member.bio}</div>
              )}
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}