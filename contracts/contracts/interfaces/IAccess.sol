// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAccess {

    // Enum 
enum Role { Admin, Patient, Doctor, Insurer }

    // Fonctions de lecture de base 
    function checkRole(address _user) external view returns (Role);
    function isActive(address _user)  external view returns (bool);

    //Helpers par rôle 
    function isAdmin(address _user)   external view returns (bool);
    function isPatient(address _user) external view returns (bool);
    function isDoctor(address _user)  external view returns (bool);
    function isInsurer(address _user) external view returns (bool);

    // Fonctions d'écriture
    function registerUser(address _user, Role _role)        external;
    function changeUserRole(address _user, Role _newRole)   external;
    function setUserActive(address _user, bool _active)     external;

    // Events
    event UserRegistered(address indexed user, Role role);
    event RoleChanged(address indexed user, Role oldRole, Role newRole);
    event UserStatusChanged(address indexed user, bool active);
}