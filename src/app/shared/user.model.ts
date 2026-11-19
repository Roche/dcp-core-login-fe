export interface TokenResponse {
  refresh_token: string;
  expires_in?: number;
  access_token: string;
}

export interface UserInfoResponse {
  id: number;
  UnixId: string;
  DisplayName: string;
  Email: string;
  LastSessionSiteId: number;
  Settings: {
    TimeFormat: string,
    DateFormat: string
  };
  Sites: {
    Id: number,
    Name: string,
    TimeZone: string,
    IsEnabled: true
  }[];
}

export interface AdUserModel extends TokenResponse {
  uid?: string;
  userName: string;
  displayName: string;
  permissions?: UserPermissionModel[];
  sites?: UserSiteModel[];
  isGlobalAdmin: string;
  isGlobalApiUser: string;
  dateFormat?: string;
  timeFormat?: string;
  currentLoggedUserId?: string;
  userId?: number;
}
export interface UserSettingsModel {
  timeFormat: string;
  dateFormat: string;
}

export interface UserPermissionModel {
  Permission: string;
  SiteId: number;
  SiteName: string;
  Module: string;
}

export interface UserSiteModel {
  Name: string;
  ShortName?: string;
  SiteId: number;
  TimeZone: string;
  IsEnable: boolean;
  SiteType?: number;
  Modules?: any;
  DataSources?: any;
}
