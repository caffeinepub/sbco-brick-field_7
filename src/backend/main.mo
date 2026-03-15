import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type AppInfo = {
    name : Text;
    description : Text;
    version : Text;
    author : Text;
  };

  public type Metrics = {
    totalOrders : Nat;
    bricksDispatched : Nat;
    orderClosed : Nat;
    totalDueAmount : Nat;
    totalPaidAmount : Nat;
  };

  public type UserProfile = {
    name : Text;
  };

  public type BrickItem = {
    brickType : Text;
    qty : Nat;
  };

  public type Order = {
    id : Nat;
    date : Text;
    customerName : Text;
    address : Text;
    phone : Text;
    brickItems : [BrickItem];
    totalBricks : Nat;
    totalAmount : Nat;
    paidAmount : Nat;
    dueAmount : Nat;
    createdAt : Int;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let orders = Map.empty<Nat, Order>();
  var nextOrderId = 1;

  var metrics : Metrics = {
    totalOrders = 0;
    bricksDispatched = 0;
    orderClosed = 0;
    totalDueAmount = 0;
    totalPaidAmount = 0;
  };

  public query ({ caller }) func getAppInfo() : async AppInfo {
    {
      name = "SBCO Brick Field Order Management";
      description = "Store dashboard stats for bricks order management.";
      version = "1.1.0";
      author = "Smart Contracts India";
    };
  };

  public query func getMetrics() : async Metrics {
    metrics;
  };

  public shared ({ caller }) func updateMetrics(updatedMetrics : Metrics) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update metrics");
    };
    metrics := updatedMetrics;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared func createOrder(
    date : Text,
    customerName : Text,
    address : Text,
    phone : Text,
    brickItems : [BrickItem],
    totalBricks : Nat,
    totalAmount : Nat,
    paidAmount : Nat,
    dueAmount : Nat,
  ) : async Nat {
    let orderId = nextOrderId;
    nextOrderId += 1;

    let newOrder : Order = {
      id = orderId;
      date;
      customerName;
      address;
      phone;
      brickItems;
      totalBricks;
      totalAmount;
      paidAmount;
      dueAmount;
      createdAt = Time.now();
    };

    orders.add(orderId, newOrder);

    metrics := {
      metrics with
      totalOrders = metrics.totalOrders + 1;
      totalPaidAmount = metrics.totalPaidAmount + paidAmount;
      totalDueAmount = metrics.totalDueAmount + dueAmount;
    };

    orderId;
  };

  public query ({ caller }) func listOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can list orders");
    };

    orders.values().toArray();
  };
};
