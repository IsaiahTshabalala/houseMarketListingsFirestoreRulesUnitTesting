## 2026-02-08 - ITA
* Removed duplicate indexes in the firestore.indexes file.
* Ensured that the Firestore rules in firestore.rules file match those at the online database.

## 2026-02-08 - ITA - Version 1.0.8
* Queries for looking for listings within a certain price range require a composite index that has all the fields specified in the query. For the house-market-listings app, this resulted in the creation of 6 composite indexes, each with 6 to 8 fields.
* To re-coup the index costs, removed the previously created mergeable composite fields. The newly created indexes, together with the other remaining listings composite indexes, easily accomodate queries that involve only equality checks.

## 2026-06-11 to 2026-06-11 - ITA - Version 1.0.9
* Updated the moderator role check to include the login check and to keep up with the current Firebase implementation.
