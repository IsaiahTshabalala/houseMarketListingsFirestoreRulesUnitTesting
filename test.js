// File: ./test.js
// Description:
// To test Firestore rules for the Firestore database of this project:
// https://github.com/IsaiahTshabalala/houseMarketListings
// In the terminal run mocha test.
// -----------------------------------------------------------------------------
// Date        Dev    Version   Description
// 2023/09/27  ITA    1.00      Genesis.
// -----------------------------------------------------------------------------
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';

import * as fs from 'fs';

import { 
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';

const PROJECT_ID = process.env.PROJECT_ID;  // NB. This will cause an error. Paste your project-id string here.
                                           // This project_id should placed on code uploaded on repositories.

const rootPath = '/databases/{database}';
let testEnv,
    isaiahId,
    isaiahContext,
    dumisaniId,
    dumisaniContext,
    unAuthContext;


before(async function() {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    },
  });

  await testEnv.clearFirestore();
});

after(async function() {
  await testEnv.cleanup();
});


beforeEach(function(){
  // Authenticated user instances
  isaiahId = 'bSqvZrhc3QaZcbFN2BHeSydxTrrx';
  isaiahContext = testEnv.authenticatedContext(isaiahId);
  dumisaniId = 'Uh7aNsjbBMPci9LNW781Cr61ewR4';
  dumisaniContext = testEnv.authenticatedContext(dumisaniId);
  
  // Unauthenticated user instance
  unAuthContext = testEnv.unauthenticatedContext();
});


// Use the Firestore instance associated with this context
describe('Security Rules Test...', async function(){

  it('Test case: Authenticated user is able to create a new document that is theirs', async function(){
    const docRefIsaiah = doc(isaiahContext.firestore(), '/users', isaiahId);
    
    const dataIsaiah = {
      "personalDetails": {
          "displayName": "Isaiah",
          "firstName": "Isaiah",
          "surname": "Tshabalala",
          "dateOfBirth": Timestamp.fromDate(new Date("1977-12-17")),
          "mobileNo": "0123456789",
          "email": "isaiah.tshabalala@outlook.com",
          "address": {
              "streetNo": "2638",
              "provincialCode": "ZA_GP", 
              "municipalityCode": "G1u_GT421",  // Please use the codes as seen in the provinces, municipalities, main places and sub-places collections and sub-collections.
              "mainPlaceCode": "qVX_760002",
              "subPlaceCode": "qp7_760002002",
              "streetName": "Cougar Str."
          }
      },
      "flagged": false
  };
    await assertSucceeds(setDoc(docRefIsaiah, dataIsaiah));
  });

  it('Test case: An authenticated user can read their document', async function(){
    // Accessing Isaiah's document using Dumisani's credentials
    const docRefIsaiah = doc(isaiahContext.firestore(), '/users', isaiahId);
    await assertSucceeds(getDoc(docRefIsaiah));
  });

  it('Test to ensure that authenticated user can update their document', async function(){
    const docRefIsaiah = doc(isaiahContext.firestore(), '/users/', isaiahId);

    let updateData = {
                    'personalDetails.firstName': 'Mbalekelwa',
                    'personalDetails.mobileNo' : '1234567890',
                    'personalDetails.address.complexName': 'Safari Gardens',
                    'personalDetails.address.unitNo': '12'
                  };

    await assertSucceeds(updateDoc(docRefIsaiah, updateData, {merge: true})); 
    
  });

  it('Test Case: An Authenticated user can delete their document', async function(){
    const docRefIsaiah = doc(isaiahContext.firestore(), '/users', isaiahId);
    await assertSucceeds(deleteDoc(docRefIsaiah));
  });

  it('Test case: An authenticated user can read another user\'s document', async function(){
    
    // Attempting to access Isaiah's user doc using Dumisani's authenticated context.
    const docRefIsaiah = doc(dumisaniContext.firestore(), '/users', isaiahId);
    await assertFails(getDoc(docRefIsaiah));
  });

  it('Test case: An authenticated user cannot update another user\'s document', async function(){
  
    const docRefIsaiah = doc(dumisaniContext.firestore(), '/users', isaiahId); // Isaiah's user doc.
    const newData = {'personalDetails.firstName': 'Patrick', 'personalDetails.surname': 'Msholozi'};
    await assertFails(updateDoc(docRefIsaiah, newData, {merge: true}));
  });

  it('Test case: An unauthenticated user is unable to create a new document', async function() {
    const docRefUnAuth = doc(unAuthContext.firestore(), '/users', isaiahId);
    const dataUnAuth = {
                        firstName: 'Isaac', surname: 'Chabalala',
                        dateOfBirth: Timestamp.fromDate(new Date('17-12-1977')),
                        mobileNo: '0712341231', email: 'chabalala@gmail.com',
                        address: {
                          streetNo: '671',
                          provincialCode: 'ZA_GP',
                          municipalityCode: 'ZN4_GT421',
                          mainPlaceCode: 'n8h_760002',
                          subPlaceCode: 'CQa_760002001'
                        }
                      };
    await assertFails(setDoc(docRefUnAuth, dataUnAuth));
  });

  
  it('Test case: An authenticated user cannot create a document in another user\'s name', async function() {
    const sbuId = 'sbu';
    const docRefSbu = doc(isaiahContext.firestore(), '/users', sbuId);
    const dataSbu = {
                      firstName: 'Sbusiso', surname: 'Madi',
                      mobileNo: '841234567', email: 'sbusiso@webmail.co.za',
                      address: {
                        streetNo: '671',
                        streetName: 'Mgababa Str.',
                        streetNo: '671',
                        provincialCode: 'ZA_GP',
                        municipalityCode: 'ZN4_GT421',
                        mainPlaceCode: 'n8h_760002',
                        subPlaceCode: 'CQa_760002001'
                      }
                    };
    await assertFails(setDoc(docRefSbu, dataSbu));
  });

  it('Test case: An authenticated user can create a valid listing: property type Apartment/Flat', async function() {
    const docRefListing = doc(isaiahContext.firestore(), '/listings', 'listing1');
    let dateNow = new Date();
    let expiryDate = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + 1);

    const listingData = {
      dateCreated: Timestamp.fromDate(dateNow),
      title: 'A spacious room for rent in Orange Farm',
      description: 'A beautiful room. Ideal for a working single person.',
      propertyType: 'Apartment/Flat',
      transactionType: 'Sale',
      address: {
        streetNo: '25A',
        streetName: 'Tamboti Drive',
        provincialCode: 'ZA_GP',
        municipalityCode: 'ZN4_GT421',
        mainPlaceCode: 'n8h_760002',
        subPlaceCode: 'CQa_760002001'
      },
      priceInfo: {
        regularPrice: 2000.00,
        offer: {
          discountedPrice: 1000,
          appliesFor: 1,
          expiryDate: Timestamp.fromDate(expiryDate)
        }
      },
      mapCoordinates: {
        latitude: 27.34125,
        longitude: -28.343415
      },
      parkingCapacity: 1,
      totalFloorArea: 25,
      numBedrooms: 1,
      numBathrooms: 1,
      images: [{ fileName: 'image1', url: 'image1'}, { fileName: 'image2', url: 'image2'}],
      rates: {
        utilityRates: {
          amount: 500.01,
          frequency: 1
        }
        ,
        propertyTax: {
          amount: 1000,
          frequency: 6
        },
        associationFees: {
          amount: 1000,
          frequency: 6
        }
      },
      flagged: false,
      userId: isaiahId
    };

    await assertSucceeds(setDoc(docRefListing, listingData));
  });
  
  it('Test case: a user cannot create a listing not in their name', async function() {
    const docRefListing = doc(isaiahContext.firestore(), '/listings', 'listing2');
    let dateNow = new Date();
    let expiryDate = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate(), 23, 59);
    //console.log(expiryDate);

    const listingData = {
      dateCreated: Timestamp.fromDate(dateNow),
      title: 'A flat in Cetshwayo Hills Lakeside Ext.1',
      description: 'A beatiful apartment. Ideal for a family of up to 4.',
      propertyType: 'House',
      transactionType: 'Sale',
      address: {
        unitNo: 'C1',
        complexName: 'Cetshwayo Hills',
        streetNo: '25A',
        streetName: 'Tamboti Gar',
        provincialCode: 'ZA_GP',
        municipalityCode: 'zVv_JHB',
        mainPlaceCode: '7bI_798006',
        subPlaceCode: 'sw2_798006004'
      },
      priceInfo: {
        regularPrice: 2000.00,
        offer: {
          discountedPrice: 1000,
          appliesFor: 1,
          expiryDate: Timestamp.fromDate(expiryDate)
        }
      },
      mapCoordinates: {
        latitude: 27.34125,
        longitude: -28.343415
      },
      garageCapacity: 5,
      parkingCapacity: 1,
      totalFloorArea: 300,
      numBedrooms: 2,
      numBathrooms: 1,      
      rates: {
        utilityRates: {
          amount: 500.01,
          frequency: 1
        }
        ,
        propertyTax: {
          amount: 1000,
          frequency: 6
        },
        associationFees: {
          amount: 1000,
          frequency: 6
        }
      },
      images: [{ fileName: 'image1', url: 'image1'}, { fileName: 'image2', url: 'image2'}],
      userId: dumisaniId,
      flagged: false
    };

    await assertFails(setDoc(docRefListing, listingData)); // It must fail because the userId is not the same as that of the creator of the doc.

  });
  
  it('Test case: an authenticated user can update any listing that they created', async function() {
    const docRefListing = doc(isaiahContext.firestore(), '/listings', 'listing1'); 
    const newData = {
      'description': 'A spacious room in Lakeside Ext.1, Orange Farm',
      'mapCoordinates' : {
        'latitude': 15.3432,
        'longitude': -34.343431
      }
    };

    assertSucceeds(updateDoc(docRefListing, newData, {merge: true}));
  });

  it('Test case: an authenticated user cannot update any listing that is not theirs', async function() {
    const docRefListing = doc(dumisaniContext.firestore(), '/listings', 'listing1'); 
    const newData = {
      'description': 'A spacious room in Lakeside Ext.1, Orange Farm'
    };

    await assertFails(updateDoc(docRefListing, newData, {merge: true}));
  });

  it('Test case: an unauthenticated user can view a non-flagged listing', async function() {
    const docRefListing = doc(unAuthContext.firestore(), '/listings', 'listing1'); // This document has the field flagged set to false
    await assertSucceeds(getDoc(docRefListing));
  });

  it('Test case: An authenticated user can view a non-flagged listing', async function() {
    const docRefListing = doc(dumisaniContext.firestore(), '/listings', 'listing1');
    await assertSucceeds(getDoc(docRefListing));
  });

  
  it('Test case: My other listing test', async function() {
    const testListing = {      
      address: 
      { 
        streetNo: '2638',
        provincialCode: 'ZA_GP',
        municipalityCode: 'ZN4_GT421',
        mainPlaceCode: 'n8h_760002',
        subPlaceCode: 'CQa_760002001'
      },
      dateCreated: Timestamp.fromDate(new Date()),
      description: "New house.",
      flagged: false,
      images: [{ fileName: 'image1', url: 'image1'}, { fileName: 'image2', url: 'image2'}],
      mapCoordinates: {latitude: 13.4143, longitude: 103.3414},
      numBathrooms: 1,
      numBedrooms: 2,
      parkingCapacity: 1,
      priceInfo: {regularPrice: 254000},
      propertyType: "House",
      title: "New house in Orange Farm",
      totalFloorArea: 225,
      transactionType: "Sale",
      userId: isaiahId
    };
    const docRefListing = doc(isaiahContext.firestore(), '/listings', '123435341');
    await assertSucceeds(setDoc(docRefListing, testListing));
  });
});


