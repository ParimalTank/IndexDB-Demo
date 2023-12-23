"use client"
import { useState, useEffect } from 'react'


export const USER_DATA = [
  {
    id: 1,
    firstName: "Suman",
    lastName: "Kumar",
    email: "suman@test.com",
    age: 10
  },
  {
    id: 2,
    firstName: "Rahul",
    lastName: "Kumar",
    email: "rahul@test.com",
    age: 15
  },
];

export default function Home() {


  const [allUser, setAllUser] = useState([])
  const [addUser, setAddUser] = useState(false);
  const [editUser, setEditUser] = useState(false);
  console.log("editUser: ", editUser);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState({});
  const [age, setAge] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');

  console.log("This is All User: ", allUser);

  let idb: any;

  if (typeof window !== "undefined") {
    idb = window?.indexedDB;
  }

  // Insert Data Into IndexDb
  const insertDataInIndexedDb = () => {
    if (typeof window !== "undefined") {

      if (!idb) {
        console.log("This browser doesn't support IndexedDB");
        return;
      }

      const request = idb.open("test-db", 1);

      request.onerror = function (event: any) {
        console.error("An error occurred with IndexedDB");
        console.error(event);
      };

      request.onupgradeneeded = function (event: any) {
        console.log(event);
        const db = request.result;

        if (!db.objectStoreNames.contains("userData")) {
          const objectStore = db.createObjectStore("userData", { keyPath: "id" });
        }
      };

      request.onsuccess = function () {
        console.log("Database opened successfully");

        const db = request.result;

        var tx = db.transaction("userData", "readwrite");
        var userData = tx.objectStore("userData");


        USER_DATA.forEach((item) => userData.add(item));

        return tx.oncomplete;
      };


    }
  }

  // Get All Data
  const getAllData = () => {
    const dbPromise = idb.open("test-db", 1);

    dbPromise.onsuccess = () => {
      const db = dbPromise.result;

      var tx = db.transaction("userData", "readonly");
      var userData = tx.objectStore("userData");

      const users = userData.getAll();

      users.onsuccess = (query: any) => {
        setAllUser(query?.srcElement?.result)
      }

      tx.oncomplete = function () {
        db.close()
      }

    }
  }

  const getAgeWiseData = () => {
    try {
      const dbPromise = idb.open("test-db", 1);
      const filteredRecords: any = []

      // const keyRangeValue = IDBKeyRange.lowerBound(12);
      // const keyRangeValue = IDBKeyRange.upperBound(12);
      const keyRangeValue = IDBKeyRange.bound(parseInt(minAge), parseInt(maxAge), false, false);
      // If true then these values are not included other wise these will be included.
      dbPromise.onsuccess = function () {
        const db = dbPromise.result;

        if (db.objectStoreNames.contains('userData')) {
          const transaction = db.transaction('userData', "readonly");
          const objectStore = transaction.objectStore('userData');

          const dataIdIndex = objectStore.index("age");
          dataIdIndex.openCursor(keyRangeValue).onsuccess = function (event: any) {
            const cursor = event.target.result;
            if (cursor) {
              if (cursor.value) {
                if (parseInt(cursor.value.age) > 0) {
                  console.log(cursor.value);
                  filteredRecords.push(cursor.value)
                }
              }

              cursor.continue();
            }
          };

          transaction.oncomplete = function (event: any) {
            setAllUser(filteredRecords)
            db.close();
          };
        }
      };
    } catch (error) {
      console.log(error);
    }
  }

  const handleSubmit = (event: any) => {
    const dbPromise = idb.open("test-db", 1);
    console.log(addUser, editUser);

    if (firstName && lastName && email) {
      dbPromise.onsuccess = () => {
        const db = dbPromise.result;

        var tx = db.transaction("userData", "readwrite");
        var userData = tx.objectStore("userData");

        console.log(addUser, editUser);
        console.log(addUser, editUser);
        if (addUser) {
          const users = userData.put({
            id: allUser?.length + 1,
            firstName,
            lastName,
            email,
            age,
          });

          console.log("add");
          users.onsuccess = (query: any) => {
            tx.oncomplete = function () {
              db.close();
            };
            alert("User added!");
            setFirstName("");
            setLastName("");
            setEmail("");
            setAge('')
            setAddUser(false);
            getAllData();
            event.preventDefault();
          };
        } else {
          const users = userData.put({
            id: selectedUser?.id,
            firstName,
            lastName,
            email,
            age,
          });
          console.log("edit");

          users.onsuccess = (query: any) => {
            tx.oncomplete = function () {
              db.close();
            };
            alert("User updated!");
            setFirstName("");
            setLastName("");
            setEmail("");
            setAge('')
            setEditUser(false);
            getAllData();
            setSelectedUser({});
            event.preventDefault();
          };
        }
      };
    } else {
      alert("Please enter all details");
    }
  };

  const deleteSelected = (user: any) => {
    const dbPromise = idb.open("test-db", 1);

    dbPromise.onsuccess = function () {
      const db = dbPromise.result;
      var tx = db.transaction("userData", "readwrite");
      var userData = tx.objectStore("userData");
      const deleteUser = userData.delete(user.id);

      deleteUser.onsuccess = (query: any) => {
        tx.oncomplete = function () {
          db.close();
        };
        alert("User deleted!");
        getAllData();
      };
    };
  };


  useEffect(() => {
    getAllData();
    insertDataInIndexedDb();
    // getAgeWiseData();
  }, []);


  return (
    <div className="row" style={{ padding: 100 }}>
      <div className="col-md-6">

        {/* FOR Adding Data  */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <input type='number' value={minAge} onChange={e => setMinAge(e.target.value)} className="form-control" style={{ width: '200px' }} placeholder="Enter Min Age" />
            <input type='number' value={maxAge} onChange={e => setMaxAge(e.target.value)} className="form-control ml-2" style={{ width: '200px' }} placeholder="Enter Max Age" />
            <button type="button" className="btn btn-info mt-2" onClick={() => getAgeWiseData()}>Filter</button>
            <button type="button" className="btn btn-secondary mt-2" onClick={() => getAllData()}>Clear</button>
          </div>
          <button
            className="btn btn-primary float-end mb-2"
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setAge('')
              setEditUser(false);
              setAddUser(true);
            }}
          >
            Add
          </button>
        </div>


        <table className="table table-bordered">
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Age</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allUser?.map((user: any) => {
              return (
                <tr key={user?.id}>
                  <td>{user?.firstName}</td>
                  <td>{user?.lastName}</td>
                  <td>{user?.age}</td>
                  <td>{user?.email}</td>
                  <td>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        setAddUser(false);
                        setEditUser(true);
                        setSelectedUser(user);
                        setEmail(user?.email);
                        setAge(user?.age)
                        setFirstName(user?.firstName);
                        setLastName(user?.lastName);
                      }}
                    >
                      Edit
                    </button>{" "}
                    <button
                      type='button'
                      className="btn btn-danger"
                      onClick={() => deleteSelected(user)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="col-md-6">
        {editUser || addUser ? (
          <div className="card" style={{ padding: "20px" }}>
            <h3>{editUser ? "Update User" : "Add User"}</h3>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
              />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                className="form-control"
                onChange={(e) => setAge(e.target.value)}
                value={age}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>
            <div className="form-group">
              <button
                className="btn btn-primary mt-2"
                type="submit"
                onClick={handleSubmit}
              >
                {editUser ? "Update" : "Add"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
